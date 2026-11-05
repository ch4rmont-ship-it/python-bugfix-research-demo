export const SOLUTIONS = {
  sum: `def sum_positive(nums):
    total = 0
    for n in nums:
        if n > 0:
            total += n
    return total`,
  signs: `def count_signs(nums):
    positive = 0
    negative = 0
    for n in nums:
        if n >= 0:
            positive += 1
        else:
            negative += 1
    return {'non_negative': positive, 'negative': negative}`,
  rain: `def average_rainfall(values):
    if not values:
        return 0
    return round(sum(values) / len(values), 2)`,
  pal: `def is_palindrome(s):
    return s == s[::-1]`,
  fib: `def fibonacci(n):
    a, b = 0, 1
    out = []
    for _ in range(n):
        out.append(a)
        a, b = b, a + b
    return out`
};
