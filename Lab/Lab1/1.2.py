# EncryptPic_Test.py
from handout.encryptPic import Encrypt, Decrypt
from Crypto.Cipher import AES
from Crypto import Random


def main():
    aes_key = Random.new().read(AES.block_size)
    aes_iv = Random.new().read(AES.block_size)
    
    # Encrypt using ECB
    print("=== Encrypting with ECB Mode ===")
    Encrypt(mode=AES.MODE_ECB, input_file="./handout/pic_original.bmp", output_file="encrypted_ecb.bmp")
    print("ECB Encryption completed. Check 'encrypted_ecb.bmp'.\n")
    
    # Encrypt using CBC
    print("=== Encrypting with CBC Mode ===")
    Encrypt(mode=AES.MODE_CBC, input_file="./handout/pic_original.bmp", output_file="encrypted_cbc.bmp", iv=aes_iv)
    print("CBC Encryption completed. Check 'encrypted_cbc.bmp'.\n")

if __name__ == "__main__":
    main()