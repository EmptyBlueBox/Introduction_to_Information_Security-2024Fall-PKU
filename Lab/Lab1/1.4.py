# Padding_Test.py
from handout.Encrypt import EncryptDataECB, EncryptDataCBC

def main():
    aes_key = "0CoJUm6Qyw8W8jud"
    aes_iv = "9999999999999999"
    
    # Texts of different lengths
    texts = [
        "Short text",                # Less than 16 bytes
        "Sixteen bytestxt",        # Exactly 16 bytes
        "This text is longer than sixteen bytes."
    ]

    # ECB Mode
    print("=== ECB Mode ===")
    encrypt_ecb = EncryptDataECB(aes_key)
    for text in texts:
        encrypted = encrypt_ecb.encrypt(text)
        print(f"Plaintext Length: {len(text)} | Ciphertext Length: {len(encrypted)} | Plaintext: {text}")
    print()

    # CBC Mode
    print("=== CBC Mode ===")
    encrypt_cbc = EncryptDataCBC(aes_key, aes_iv)
    for text in texts:
        encrypted = encrypt_cbc.encrypt(text)
        print(f"Plaintext Length: {len(text)} | Ciphertext Length: {len(encrypted)} | Plaintext: {text}")
    print()

if __name__ == "__main__":
    main()