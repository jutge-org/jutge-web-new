export type PyWebDemo = {
    name: string
    code: string
}

export const pyWebDemos: readonly PyWebDemo[] = [
    {
        name: 'Good morning!',
        code: `
name = input('What is your name? ')

print("Good morning", name)
`,
    },
    {
        name: 'Product of two numbers',
        code: `
a = int(input('Enter a number: '))
b = int(input('Enter a number: '))
p = a * b
print('The product of', a, 'and', b, 'is', p)
`,
    },
    {
        name: 'Maximum of two numbers',
        code: `
a = int(input('Enter a number: '))
b = int(input('Enter a number: '))
if a >= b:
    m = a
else:
    m = b
print('The maximum of', a, 'and', b, 'is', m)
`,
    },
    {
        name: 'Draw a square',
        code: `
import turtle

m = int(input('Size of the square? '))
print("Okay, drawing a square of size", m)
for i in range(4):
    turtle.forward(m)
    turtle.right(90)
turtle.done()
`,
    },
    {
        name: 'Draw a triangle',
        code: `
from turtle import *

m = int(input('Size of the triangle? '))
forward(m)
right(120)
forward(m)
right(120)
forward(m)
right(120)
done()
`,
    },
    {
        name: 'Factorial',
        code: `
n = int(input('Enter a number: '))
f = 1
for i in range(2, n + 1):
    f = f * i
print("The factorial of", n, "is", f)
`,
    },
    {
        name: 'Greatest common divisor',
        code: `
a = int(input('Enter a first number: '))
b = int(input('Enter a second number: '))
while a != b:
    if a > b:
        a = a - b
    else:
        b = b - a
print("The greatest common divisor of the two numbers is", a)
`,
    },
]
