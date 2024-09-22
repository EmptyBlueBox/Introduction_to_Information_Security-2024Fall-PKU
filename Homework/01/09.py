import numpy as np
import string

def mod_inverse_matrix(matrix, modulus):
    det = int(np.round(np.linalg.det(matrix)))
    det_inv = pow(det, -1, modulus)
    matrix_mod_inv = det_inv * np.round(det * np.linalg.inv(matrix)).astype(int) % modulus
    return matrix_mod_inv

def char_to_num(char):
    return ord(char) - ord('A')

def num_to_char(num):
    return chr(num + ord('A'))

def preprocess_text(text):
    return ''.join(filter(lambda c: c in string.ascii_letters, text)).upper()

def hill_encrypt(plaintext, key_matrix):
    n = key_matrix.shape[0]
    plaintext = preprocess_text(plaintext)
    if len(plaintext) % n != 0:
        plaintext += 'X' * (n - len(plaintext) % n)

    ciphertext = ""
    for i in range(0, len(plaintext), n):
        block = np.array([char_to_num(c) for c in plaintext[i:i+n]])
        encrypted_block = key_matrix.dot(block) % 26
        ciphertext += ''.join(num_to_char(num) for num in encrypted_block)
    
    return ciphertext

def hill_decrypt(ciphertext, key_matrix):
    n = key_matrix.shape[0]
    inverse_key_matrix = mod_inverse_matrix(key_matrix, 26)
    
    plaintext = ""
    for i in range(0, len(ciphertext), n):
        block = np.array([char_to_num(c) for c in ciphertext[i:i+n]])
        decrypted_block = inverse_key_matrix.dot(block) % 26
        plaintext += ''.join(num_to_char(num) for num in decrypted_block)
    
    return plaintext

key_matrix = np.array([[3, 3], [2, 5]])

plaintext = "Thou to live, thou art alive."
ciphertext = hill_encrypt(plaintext, key_matrix)
decryptedtext = hill_decrypt(ciphertext, key_matrix)

print(f"Plaintext: {plaintext}")
print(f"Ciphertext: {ciphertext}")
print(f"Decrypted Text: {decryptedtext}")
