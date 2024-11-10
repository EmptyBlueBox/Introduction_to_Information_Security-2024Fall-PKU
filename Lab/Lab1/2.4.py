import sys
from io import StringIO
from handout.Collision import main as collision_main

# Simulate user input
test_cases = [
    ('1', 'testseed1', '10'),  # MD5
    ('2', 'testseed2', '10'),  # SHA1
    ('3', 'testseed3', '10')   # SHA256
]

original_stdin = sys.stdin
for mode, seed, time_limit in test_cases:
    sys.stdin = StringIO(f"{mode}\n{seed}\n{time_limit}\n\n")
    collision_main()

sys.stdin = original_stdin