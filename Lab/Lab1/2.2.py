# HMAC_Test.py
from handout.HMAC import main as hmac_main

def test_hmac():
    import sys
    from io import StringIO

    # Simulate user input
    test_cases = [
        ('1', '2', './handout/hello.txt', 'secretkey1'),  # MD5, File input
        ('2', '2', './handout/hello.txt', 'secretkey2'),  # SHA1, File input
        ('3', '2', './handout/hello.txt', 'secretkey3')   # SHA256, File input
    ]
    
    original_stdin = sys.stdin
    for mode, input_type, filename, secret in test_cases:
        sys.stdin = StringIO(f"{mode}\n{input_type}\n{filename}\n{secret}\n")
        hmac_main()
    
    sys.stdin = original_stdin

if __name__ == "__main__":
    test_hmac()