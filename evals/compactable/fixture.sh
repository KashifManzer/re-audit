set -e
git init -q
git config user.email eval@example.com
git config user.name eval
printf 'def total(nums):\n    return sum(nums)\n' > calc.py
git add . && git commit -qm init
cat >> calc.py <<'PY'


def positives(nums):
    result = []
    for n in nums:
        if n > 0:
            result.append(n)
        else:
            continue
    return result
PY
