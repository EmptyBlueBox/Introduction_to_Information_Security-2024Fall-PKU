from Crypto.Cipher import AES
from Crypto import Random
from Crypto.Util.Padding import pad, unpad

key = Random.new().read(AES.block_size)
iv = Random.new().read(AES.block_size)


mode = AES.MODE_CBC
# mode = AES.MODE_ECB


def Encrypt(mode, input_file, output_file, iv=None):
    input_file = open(input_file, "rb")
    input_data = input_file.read()
    input_file.close()

    cipher = AES.new(key, AES.MODE_ECB) if mode == AES.MODE_ECB else AES.new(key, AES.MODE_CBC, iv)
    enc_data = cipher.encrypt(pad(input_data, 16))
    correct_data = bytearray(enc_data)
    correct_data[:54] = input_data[:54]

    enc_file = open(output_file, "wb")
    enc_file.write(correct_data)
    enc_file.close()

def Decrypt(mode, input_file, output_file, iv=None):
    enc_file2 = open(input_file, "rb")
    enc_data2 = enc_file2.read()
    enc_file2.close()

    decipher = AES.new(key, AES.MODE_ECB) if mode == AES.MODE_ECB else AES.new(key, AES.MODE_CBC, iv)
    plain_data = unpad(decipher.decrypt(enc_data2))

    output_file = open(output_file, "wb")
    output_file.write(plain_data)
    output_file.close()

# Encrypt("./handout/pic_original.bmp", "encrypted.bmp")
# Decrypt("./handout/encrypted.bmp", "output.bmp")
