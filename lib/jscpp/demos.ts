type JsCppDemo = {
    name: string
    code: string
    input: string
}

export const defaultJsCppProgram = `#include <iostream>
using namespace std;

int main() {
    int a;
    cin >> a;
    a += 7;
    cout << a * 10 << endl;
    return 0;
}
`

export const defaultJsCppInput = '5'

export const jsCppDemos: readonly JsCppDemo[] = [
    {
        name: 'Add seven',
        code: defaultJsCppProgram,
        input: defaultJsCppInput,
    },
    {
        name: 'Sum of two numbers',
        code: `#include <iostream>
using namespace std;

int main() {
    int a;
    int b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
`,
        input: '3 4',
    },
    {
        name: 'Countdown',
        code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    while (n > 0) {
        cout << n << endl;
        n = n - 1;
    }
    return 0;
}
`,
        input: '3',
    },
    {
        name: 'Maximum of two numbers',
        code: `#include <iostream>
using namespace std;

int max2(int a, int b) {
    if (a >= b) {
        return a;
    } else {
        return b;
    }
}

int main() {
    int a;
    int b;
    cin >> a >> b;
    cout << max2(a, b) << endl;
    return 0;
}
`,
        input: '3 9',
    },
]
