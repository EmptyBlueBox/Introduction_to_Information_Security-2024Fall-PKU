from handout.Encrypt import EncryptDataECB, EncryptDataCBC
import base64

def modify_byte(data, index, new_byte):
    # Convert the data to a bytearray for mutability
    data = bytearray(data)
    # Modify the specified byte
    data[index] = new_byte
    return bytes(data)

def main():
    aes_key = "0CoJUm6Qyw8W8jud"
    aes_iv = "9999999999999999"
    
    # Read the contents of sample.txt
    with open("./handout/sample.txt", "r", encoding='utf-8') as file:
        plaintext = file.read()

    # ECB Mode
    print("=== ECB Mode ===")
    encrypt_ecb = EncryptDataECB(aes_key)
    encrypted_ecb = encrypt_ecb.encrypt(plaintext)
    print(f"Original Encrypted (ECB): {encrypted_ecb}")

    # Decode the base64 string to bytes
    encrypted_ecb_bytes = base64.b64decode(encrypted_ecb)

    # Modify the 30th byte of the ECB ciphertext
    modified_ecb_bytes = modify_byte(encrypted_ecb_bytes, 29, 0x00)

    # Re-encode the modified bytes back to a base64 string
    modified_ecb = base64.b64encode(modified_ecb_bytes).decode('utf-8')
    print(f"Modified Encrypted (ECB): {modified_ecb}")

    # Decrypt the modified ECB ciphertext
    decrypted_ecb = encrypt_ecb.decrypt(modified_ecb)
    print(f"Decrypted (ECB) after modification:\n{decrypted_ecb}\n")

    # CBC Mode
    print("=== CBC Mode ===")
    encrypt_cbc = EncryptDataCBC(aes_key, aes_iv)
    encrypted_cbc = encrypt_cbc.encrypt(plaintext)
    print(f"Original Encrypted (CBC): {encrypted_cbc}")

    # Decode the base64 string to bytes
    encrypted_cbc_bytes = base64.b64decode(encrypted_cbc)

    # Modify the 30th byte of the CBC ciphertext
    modified_cbc_bytes = modify_byte(encrypted_cbc_bytes, 29, 0x00)

    # Re-encode the modified bytes back to a base64 string
    modified_cbc = base64.b64encode(modified_cbc_bytes).decode('utf-8')
    print(f"Modified Encrypted (CBC): {modified_cbc}")

    # Reinitialize the CBC cipher for decryption
    decrypt_cbc = EncryptDataCBC(aes_key, aes_iv)
    decrypted_cbc = decrypt_cbc.decrypt(modified_cbc)
    print(f"Decrypted (CBC) after modification:\n{decrypted_cbc}\n")

if __name__ == "__main__":
    main()
