#include <stdio.h>
#include <string.h>

void decrypt(char *text, int shift)
{
    int length = strlen(text);
    char decrypted[length + 1];

    for (int i = 0; i < length; i++)
    {
        char c = text[i];
        if (c >= 'A' && c <= 'Z')
        {
            decrypted[i] = (c - 'A' - shift + 26) % 26 + 'A';
        }
        else
        {
            decrypted[i] = c;
        }
    }
    decrypted[length] = '\0';
    printf("Shift %d: %s\n", shift, decrypted);
}

int main()
{
    char ciphertext[] = "BEEAKFYDJXUQYHYJIQRYHTYJIQFBQDUYJIIKFUHCQD";
    for (int shift = 1; shift < 26; shift++)
    {
        decrypt(ciphertext, shift);
    }
    return 0;
}
