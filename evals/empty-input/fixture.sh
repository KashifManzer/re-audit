set -e
git init -q
git config user.email eval@example.com
git config user.name eval
printf 'def total(nums):\n    return sum(nums)\n' > calc.py
printf 'import unittest\nfrom calc import total\n\n\nclass T(unittest.TestCase):\n    def test_total(self):\n        self.assertEqual(total([1, 2]), 3)\n' > test_calc.py
git add . && git commit -qm init
printf '\n\ndef average(nums):\n    return total(nums) / len(nums)\n' >> calc.py
