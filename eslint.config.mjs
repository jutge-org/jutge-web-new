import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { fixupConfigRules } from '@eslint/compat'

const eslintConfig = defineConfig([
    ...fixupConfigRules(nextVitals),
    ...fixupConfigRules(nextTs),
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'components/ui/**',
        'components/smoothui/**',
        'hooks/use-mobile.ts',
        'next-env.d.ts',
        'lib/jutge_api_client.ts',
    ]),
    {
        rules: {
            'react-hooks/set-state-in-effect': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/purity': 'off',
        },
    },
])

export default eslintConfig
