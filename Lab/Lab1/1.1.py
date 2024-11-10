# Encrypt_Test.py
from handout.Encrypt import EncryptDataECB, EncryptDataCBC

def main():
    aes_key = "0CoJUm6Qyw8W8jud"
    aes_iv = "9999999999999999"
    
    # Sample plaintext
    plaintext = "Hello, World! This is a test message."

    # ECB Mode
    print("=== ECB Mode ===")
    encrypt_ecb = EncryptDataECB(aes_key)
    encrypted_ecb = encrypt_ecb.encrypt(plaintext)
    print(f"Encrypted (ECB): {encrypted_ecb}")
    decrypted_ecb = encrypt_ecb.decrypt(encrypted_ecb)
    print(f"Decrypted (ECB): {decrypted_ecb}\n")

    # CBC Mode
    print("=== CBC Mode ===")
    encrypt_cbc = EncryptDataCBC(aes_key, aes_iv)
    encrypted_cbc = encrypt_cbc.encrypt(plaintext)
    print(f"Encrypted (CBC): {encrypted_cbc}")
    
    # Reinitialize the CBC cipher for decryption
    decrypt_cbc = EncryptDataCBC(aes_key, aes_iv)
    decrypted_cbc = decrypt_cbc.decrypt(encrypted_cbc)
    print(f"Decrypted (CBC): {decrypted_cbc}\n")

if __name__ == "__main__":
    main()