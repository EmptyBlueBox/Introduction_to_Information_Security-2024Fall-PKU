# Hash_Test.py
from handout.Hash import main as hash_main

def test_hash():
    import sys
    from io import StringIO

    # Redirect input to simulate user input
    test_cases = [
        ('1', '1', 'hello.txt'),  # MD5, String input
        ('2', '1', 'hello.txt'),  # SHA1, String input
        ('3', '1', 'hello.txt')   # SHA256, String input
    ]
    
    original_stdin = sys.stdin
    for mode, input_type, data in test_cases:
        sys.stdin = StringIO(f"{mode}\n{input_type}\n{data}\n")
        hash_main()
    
    sys.stdin = original_stdin

if __name__ == "__main__":
    test_hash()