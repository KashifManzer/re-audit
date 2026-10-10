set -e
git init -q
git config user.email eval@example.com
git config user.name eval
printf 'def total(nums):\n    return sum(nums)\n' > calc.py
printf 'import unittest\nfrom calc import total\n\n\nclass T(unittest.TestCase):\n    def test_total(self):\n        self.assertEqual(total([1, 2]), 3)\n' > test_calc.py
git add . && git commit -qm init
cat >> calc.py <<'PY'


def clamp(x, lo, hi):
    if lo > hi:
        raise ValueError("lo must be <= hi")
    return max(lo, min(x, hi))
PY
cat >> test_calc.py <<'PY'


from calc import clamp


class C(unittest.TestCase):
    def test_inside(self):
        self.assertEqual(clamp(5, 0, 10), 5)

    def test_below(self):
        self.assertEqual(clamp(-1, 0, 10), 0)

    def test_above(self):
        self.assertEqual(clamp(11, 0, 10), 10)

    def test_equal_bounds(self):
        self.assertEqual(clamp(3, 2, 2), 2)

    def test_bad_bounds(self):
        with self.assertRaises(ValueError):
            clamp(1, 5, 0)
PY
