# Random_Test.py
from handout.Random import next_random
from Crypto.Hash import MD5, SHA1, SHA256
from collections import Counter

def observe_distribution(seed, hash_algo, iterations=10000):
    state = seed.encode()
    buckets = [0] * 8  # There are 8 possible values for the lower 3 bits (0-7)
    
    for _ in range(iterations):
        state = next_random(hash_algo, state)
        lower_3_bits = state[0] & 7
        buckets[lower_3_bits] += 1
    
    return buckets

def main():
    seed = "testseed"
    hash_algos = {
        'MD5': MD5,
        'SHA1': SHA1,
        'SHA256': SHA256
    }
    
    for name, algo in hash_algos.items():
        distribution = observe_distribution(seed, algo)
        total = sum(distribution)
        print(f"Distribution for {name}:")
        for i, count in enumerate(distribution):
            print(f"Value {bin(i)[2:].zfill(3)}: {count} ({count / total:.2%})")
        print()

if __name__ == "__main__":
    main()