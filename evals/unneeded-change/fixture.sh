set -e
git init -q
git config user.email eval@example.com
git config user.name eval
printf 'def total(nums):\n    return sum(nums)\n' > calc.py
git add . && git commit -qm init
printf '\n\ndef is_even(n):\n    return n %% 2 == 0\n\n\ndef _format_list(items):\n    return ", ".join(str(i) for i in items)\n' >> calc.py
