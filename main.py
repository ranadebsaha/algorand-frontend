import os
import json
import base64
import binascii
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import List
from mimetypes import guess_type

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel

from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient
from algosdk import account, mnemonic
from algosdk.transaction import AssetConfigTxn, wait_for_confirmation
from algosdk.error import AlgodHTTPError
from fastapi.responses import FileResponse
from fastapi import HTTPException
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
import qrcode
from fastapi.middleware.cors import CORSMiddleware

# ------------------- Load Environment -------------------
load_dotenv()

# Gmail
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASS = os.getenv("GMAIL_PASS")

# Algorand
DEPLOYER_MNEMONIC = os.getenv("DEPLOYER")
ALGOD_API_KEY = os.getenv("ALGOD_API_KEY", "")
ALGOD_API_URL = os.getenv("ALGOD_API_URL", "https://testnet-api.algonode.cloud")
INDEXER_API_URL = os.getenv("INDEXER_API_URL", "https://testnet-idx.algonode.cloud")

TEMP_FOLDER = "./temp"
os.makedirs(TEMP_FOLDER, exist_ok=True)

if not DEPLOYER_MNEMONIC:
    raise Exception("DEPLOYER mnemonic not found in environment variables")

# Initialize Algorand clients
headers = {"X-API-Key": ALGOD_API_KEY} if ALGOD_API_KEY else {}
algod_client = AlgodClient(ALGOD_API_KEY, ALGOD_API_URL, headers)
indexer_client = IndexerClient(ALGOD_API_KEY, INDEXER_API_URL, headers)

# Deployer account
deployer_private_key = mnemonic.to_private_key(DEPLOYER_MNEMONIC)
deployer_address = account.address_from_private_key(deployer_private_key)

# ------------------- FastAPI Setup -------------------
app = FastAPI(
    title="Unified Algorand POAP API",
    description="Mint, verify, and extract POAP certificates in a single API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-frontend.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Pydantic Models -------------------
class VerifyRequest(BaseModel):
    asset_id: int

class AssetRequest(BaseModel):
    asset_id: int

# ------------------- Helper Functions -------------------
def send_certificate_email(to_email: str, txid: str, asset_id: int, qr_path: str, certificate_path: str):
    """
    Send both certificate PDF, QR code image, and the original certificate file via Gmail.
    """
    if not GMAIL_USER or not GMAIL_PASS:
        print("⚠️ Gmail credentials missing. Skipping email.")
        return False

    subject = "Your POAP Certificate 🎉"
    body = f"""
Congratulations!

Your POAP NFT certificate has been generated.

Transaction ID: {txid}
Asset ID: {asset_id}

Please find your certificate and QR code attached.

You can look it up on AlgoExplorer:

https://testnet.explorer.perawallet.app/asset/{asset_id}

Regards,
BishwasChain
"""

    try:
        msg = MIMEMultipart()
        msg["From"] = GMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Attach PDF
        #with open(pdf_path, "rb") as f:
        #    pdf_part = MIMEApplication(f.read(), _subtype="pdf")
        #    pdf_part.add_header("Content-Disposition", f"attachment; filename=certificate_{asset_id}.pdf")
        #msg.attach(pdf_part)

        # Attach QR
        with open(qr_path, "rb") as f:
            from email.mime.image import MIMEImage
            img_part = MIMEImage(f.read(), name=f"qr_{asset_id}.png")
        msg.attach(img_part)

        # Attach original certificate file
        with open(certificate_path, "rb") as f:
            file_data = f.read()
            # Guess the MIME type
            maintype, subtype = guess_type(certificate_path)[0].split('/')
            attachment_part = MIMEApplication(file_data, _subtype=subtype)
            attachment_part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(certificate_path)}")
        msg.attach(attachment_part)

        # Connect to SMTP
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(GMAIL_USER, GMAIL_PASS)
        server.send_message(msg)
        server.quit()
        print(f"📧 Certificate email successfully sent to {to_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication Error: {e}")
        print("⚠️ Make sure you use a Gmail App Password, not your normal password.")
        return False
    except Exception as e:
        print(f"❌ Failed to send email: {type(e).__name__}: {e}")
        return False

# ------------------- POAP Verifier -------------------
class POAPVerifier:
    def __init__(self, algod_client, indexer_client=None):
        self.algod_client = algod_client
        self.indexer_client = indexer_client

    def get_asset_info(self, asset_id):
        return self.algod_client.asset_info(asset_id)

    def verify_poap_structure(self, asset_info):
        params = asset_info.get("params", {})
        verification_results = {
            "is_nft": (params.get("total") == 1 and params.get("decimals") == 0),
            "correct_unit_name": params.get("unit-name") == "POAP",
            "correct_name_format": "POAP" in params.get("name", ""),
            "correct_creator": params.get("creator") == deployer_address,
        }
        return verification_results, params

    def get_asset_transactions(self, asset_id, limit=10):
        if not self.indexer_client:
            return []
        response = self.indexer_client.search_asset_transactions(asset_id=asset_id, limit=limit)
        return response.get("transactions", [])

    def extract_note_from_creation_tx(self, asset_id):
        transactions = self.get_asset_transactions(asset_id, limit=50)
        for tx in transactions:
            if tx.get("tx-type") == "acfg" and tx.get("created-asset-index") == asset_id:
                note_b64 = tx.get("note")
                if not note_b64:
                    return None
                note_bytes = base64.b64decode(note_b64, validate=False)
                try:
                    return json.loads(note_bytes.decode("utf-8"))
                except:
                    return note_bytes.decode("utf-8", errors="ignore")
        return None

    def comprehensive_verification(self, asset_id):
        asset_info = self.get_asset_info(asset_id)
        verification_results, params = self.verify_poap_structure(asset_info)
        note_content = self.extract_note_from_creation_tx(asset_id)
        passed_checks = sum(verification_results.values())
        total_checks = len(verification_results)
        overall_valid = passed_checks == total_checks
        return {
            "asset_id": asset_id,
            "asset_info": params,
            "verification_results": verification_results,
            "note_content": note_content,
            "overall_valid": overall_valid,
        }

# ------------------- Certificate Extractor -------------------
def get_certificate_details_from_asset_id(asset_id):
    try:
        asset_info = algod_client.asset_info(asset_id)
        params = asset_info.get("params", {})

        # Metadata hash
        metadata_hash_b64 = params.get("metadata-hash", "")
        certificate_hash = None
        if metadata_hash_b64:
            try:
                certificate_hash = binascii.hexlify(base64.b64decode(metadata_hash_b64)).decode()
            except:
                certificate_hash = None

        # Fetch creation transaction for note
        full_metadata = {}
        try:
            response = indexer_client.search_asset_transactions(
                asset_id=asset_id, tx_type="acfg", limit=50
            )
            transactions = response.get("transactions", [])
            creation_tx = next(
                (tx for tx in transactions if tx.get("tx-type") == "acfg" and tx.get("created-asset-index") == asset_id),
                None
            )
            if creation_tx:
                note_b64 = creation_tx.get("note", "")
                if note_b64:
                    note_bytes = base64.b64decode(note_b64)
                    full_metadata = json.loads(note_bytes.decode("utf-8"))
        except:
            pass

        certificate_details = {
            "event": full_metadata.get("event", "Data not available"),
            "organizer": full_metadata.get("organizer", "Data not available"),
            "date": full_metadata.get("date", "Data not available"),
            "recipient_name": full_metadata.get("recipient_name", "Data not available"),
            "recipient_address": full_metadata.get("recipient_address", "Data not available"),
            "issued_at": full_metadata.get("issued_at"),
            "poap_version": full_metadata.get("poap_version"),
            "type": full_metadata.get("type")
        }

        asset_basic_info = {
            "name": params.get("name"),
            "creator": params.get("creator"),
            "url": params.get("url"),
            "unit_name": params.get("unit-name")
        }

        return {
            "success": True,
            "asset_id": asset_id,
            "certificate_hash": certificate_hash,
            "certificate_details": certificate_details,
            "asset_info": asset_basic_info,
            "full_metadata": full_metadata
        }
    except AlgodHTTPError as e:
        return {"success": False, "asset_id": asset_id, "error": str(e)}
    except Exception as e:
        return {"success": False, "asset_id": asset_id, "error": f"Unexpected error: {e}"}
    
def generate_qr_image(asset_id):
    """Generate QR code image in memory containing just the asset ID."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(str(asset_id))
    qr.make(fit=True)
    img = qr.make_image(fill="black", back_color="white")
    return img

def generate_certificate_pdf(asset_id, certificate_details):
    """Generate a professional PDF certificate with embedded QR code."""
    # pdf_path = os.path.join(TEMP_FOLDER, f"certificate_{asset_id}.pdf")
    qr_img = generate_qr_image(asset_id)
    qr_path = os.path.join(TEMP_FOLDER, f"qr_{asset_id}.png")
    qr_img.save(qr_path)

    #c = canvas.Canvas(pdf_path, pagesize=A4)
    #width, height = A4

    # Certificate title
    #c.setFont("Helvetica-Bold", 24)
    #c.drawCentredString(width/2, height-4*cm, "Certificate of Attendance")

    # Event details
    #c.setFont("Helvetica", 16)
    #c.drawString(3*cm, height-6*cm, f"Event: {certificate_details.get('event', 'N/A')}")
    #c.drawString(3*cm, height-7*cm, f"Organizer: {certificate_details.get('organizer', 'N/A')}")
    #c.drawString(3*cm, height-8*cm, f"Date: {certificate_details.get('date', 'N/A')}")
    # c.drawString(3*cm, height-9*cm, f"Recipient: {certificate_details.get('recipient_name', 'N/A')}")
    # c.drawString(3*cm, height-10*cm, f"Algorand Asset ID: {asset_id}")

    # Embed QR code
    # c.drawImage(qr_path, width-7*cm, height-12*cm, width=4*cm, height=4*cm)

    # c.showPage()
    # c.save()
    return  qr_path

def find_certificate_on_chain(cert_hash: str):
    """
    Given a 64-char hex SHA256 cert_hash, check if any Algorand asset has it.
    Returns asset_id + metadata if found, else None.
    """
    try:
        digest = binascii.unhexlify(cert_hash)
        
        # Search on Algorand Indexer for assets
        # Note: Indexer allows search by metadata_hash only in asset_info
        response = indexer_client.search_assets(asset_creator=deployer_address)
        assets = response.get("assets", [])

        for asset in assets:
            params = asset.get("params", {})
            mh = params.get("metadata-hash")
            if mh:
                try:
                    mh_decoded = binascii.hexlify(base64.b64decode(mh)).decode()
                except:
                    mh_decoded = None

                if mh_decoded == cert_hash:
                    return {
                        "asset_id": asset.get("index"),
                        "params": params
                    }

        return None

    except Exception as e:
        print(f"Error searching blockchain: {e}")
        return None

# ------------------- API Routes -------------------

# Root
@app.get("/")
async def root():
    return {"message": "Unified Algorand POAP API. Endpoints: /mint, /verify, /verify-multiple, /get-certificate"}

@app.post("/mint")
async def mint_nft(
    event: str = Form(...),
    organizer: str = Form(...),
    date: str = Form(...),
    recipient_name: str = Form(...),
    recipient_email: str = Form(...),
    certificate_file: UploadFile = File(...)
):
    """
    Mints a new Algorand NFT for a certificate.
    - Takes certificate details and the file itself.
    - Hashes the file on the server.
    - Mints a new NFT with the hash and details.
    - Emails the recipient the generated PDF, QR code, and the original file.
    """
    # 1. Read file and calculate hash
    contents = await certificate_file.read()
    certificate_hash = hashlib.sha256(contents).hexdigest()
    
    # 2. Prepare metadata and mint NFT
    note_data = {
        "event": event,
        "organizer": organizer,
        "date": date,
        "recipient_name": recipient_name,
        "recipient_email": recipient_email,
        "certificate_hash": certificate_hash,
        "poap_version": "1.0",
        "type": certificate_file.content_type
    }
    note_bytes = json.dumps(note_data).encode("utf-8")

    try:
        # Build transaction
        params = algod_client.suggested_params()
        
        txn = AssetConfigTxn(
            sender=deployer_address,
            sp=params,
            total=1,
            default_frozen=False,
            unit_name="POAP",
            asset_name=f"POAP: {event}",
            manager=deployer_address,
            reserve=deployer_address,
            freeze=deployer_address,
            clawback=deployer_address,
            url=f"https://your-domain.com/poap/{certificate_hash}",
            metadata_hash=binascii.unhexlify(certificate_hash),
            note=note_bytes
        )

        signed_txn = txn.sign(deployer_private_key)
        txid = algod_client.send_transaction(signed_txn)
        
        wait_for_confirmation(algod_client, txid)
        
        # Get asset ID
        tx_response = algod_client.pending_transaction_info(txid)
        asset_id = tx_response["asset-index"]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Failed to mint NFT on Algorand: {e}")

    # 3. Save the uploaded file temporarily to attach to the email
    temp_cert_path = os.path.join(TEMP_FOLDER, certificate_file.filename)
    with open(temp_cert_path, "wb") as f:
        f.write(contents)

    # 4. Generate certificate PDF
    qr_path = generate_certificate_pdf(asset_id, note_data)

    # 5. Email certificate
    email_status = send_certificate_email(
        to_email=recipient_email,
        txid=txid,
        asset_id=asset_id,
        #pdf_path=pdf_path,
        qr_path=qr_path,
        certificate_path=temp_cert_path
    )
    
    # 6. Clean up
    os.remove(temp_cert_path)
    #os.remove(pdf_path)
    os.remove(qr_path)

    return {
        "success": True,
        "asset_id": asset_id,
        "certificate_hash": certificate_hash,
        "certificate_details": note_data,
        "email_sent": email_status
    }

# Verify single POAP
@app.post("/verify")
def verify_poap(request: VerifyRequest):
    verifier = POAPVerifier(algod_client, indexer_client)
    try:
        result = verifier.comprehensive_verification(request.asset_id)
        return result
    except Exception as e:
        return {"asset_id": request.asset_id, "error": str(e)}

# Verify multiple POAPs
@app.post("/verify-multiple")
def verify_multiple_poaps(asset_ids: List[int]):
    verifier = POAPVerifier(algod_client, indexer_client)
    results = [verifier.comprehensive_verification(aid) for aid in asset_ids]
    return results

# Get certificate details from on-chain data
@app.post("/get-certificate")
def get_certificate(request: AssetRequest):
    result = get_certificate_details_from_asset_id(request.asset_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
