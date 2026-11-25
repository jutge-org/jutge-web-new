import { ExternalLink } from '@/components/ExternalLink'
import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { Prose } from '@/components/documentation/Prose'

function MarkdownExample({ source, rendered }: { source: string; rendered: React.ReactNode }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <pre className="overflow-x-auto rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
                <code>{source}</code>
            </pre>
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground">{rendered}</div>
        </div>
    )
}

export default function DocumentationMarkdownPage() {
    return (
        <DocumentationPageShell
            activeTab="markdown"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'Markdown', url: '/documentation/markdown' },
            ]}
        >
            <Prose>
                <p>
                    This page is based on the{' '}
                    <ExternalLink href="https://guides.github.com/features/mastering-markdown/">
                        Mastering Markdown guide at GitHub
                    </ExternalLink>
                    .
                </p>

                <h2>What is Markdown?</h2>
                <p>
                    <a href="http://daringfireball.net/projects/markdown/">Markdown</a> is a lightweight and easy-to-use
                    syntax for styling all forms of writing on the Jutge.org platform. You control the display of the
                    document; formatting words as bold or italic, adding images, creating lists, and placing chunks of
                    source code are just a few of the things we can do with Markdown.
                </p>

                <h2>Examples</h2>

                <h3>Text</h3>
                <MarkdownExample
                    source={`It's very easy to make some words **bold** and other words *italic* with Markdown. You can even [link to Google!](http://google.com)`}
                    rendered={
                        <p>
                            It&apos;s very easy to make some words <strong>bold</strong> and other words <em>italic</em>{' '}
                            with Markdown. You can even{' '}
                            <a href="http://google.com" className="underline">
                                link to Google!
                            </a>
                        </p>
                    }
                />

                <h3>Lists</h3>
                <MarkdownExample
                    source={`Sometimes you want numbered lists:

1. One
2. Two
3. Three

Sometimes you want bullet points:

* Start a line with a star
* Profit!`}
                    rendered={
                        <div className="space-y-4">
                            <div>
                                <p>Sometimes you want numbered lists:</p>
                                <ol className="list-decimal pl-5">
                                    <li>One</li>
                                    <li>Two</li>
                                    <li>Three</li>
                                </ol>
                            </div>
                            <div>
                                <p>Sometimes you want bullet points:</p>
                                <ul className="list-disc pl-5">
                                    <li>Start a line with a star</li>
                                    <li>Profit!</li>
                                </ul>
                            </div>
                        </div>
                    }
                />

                <h3>Headers</h3>
                <MarkdownExample
                    source={`# This is an <h1> tag
## This is an <h2> tag
###### This is an <h6> tag`}
                    rendered={
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">This is an h1 tag</h1>
                            <h2 className="text-xl font-semibold">This is an h2 tag</h2>
                            <h6 className="text-sm font-medium">This is an h6 tag</h6>
                        </div>
                    }
                />

                <h3>Source code</h3>
                <MarkdownExample
                    source={`\`\`\`
for (int i = 0; i < 10; i++) {
    cout << i << endl;
}
\`\`\``}
                    rendered={
                        <pre className="overflow-x-auto rounded bg-muted p-3 text-sm">
                            <code>{`for (int i = 0; i < 10; i++) {
    cout << i << endl;
}`}</code>
                        </pre>
                    }
                />

                <h2>Syntax guide</h2>
                <ul>
                    <li>
                        <strong>Headers:</strong> use <code>#</code> for h1, <code>##</code> for h2, and so on.
                    </li>
                    <li>
                        <strong>Emphasis:</strong> <code>*italic*</code> or <code>_italic_</code>, <code>**bold**</code>{' '}
                        or <code>__bold__</code>.
                    </li>
                    <li>
                        <strong>Lists:</strong> unordered with <code>*</code> or <code>-</code>; ordered with numbers.
                    </li>
                    <li>
                        <strong>Links:</strong> <code>[text](url)</code>.
                    </li>
                    <li>
                        <strong>Images:</strong> <code>![alt](url)</code>.
                    </li>
                    <li>
                        <strong>Blockquotes:</strong> lines starting with <code>&gt;</code>.
                    </li>
                    <li>
                        <strong>Inline code:</strong> wrap with backticks.
                    </li>
                    <li>
                        <strong>Code blocks:</strong> fenced with triple backticks.
                    </li>
                    <li>
                        <strong>Tables:</strong> pipe-separated rows with a header separator line.
                    </li>
                    <li>
                        <strong>Strikethrough:</strong> <code>~~text~~</code>.
                    </li>
                </ul>
            </Prose>
        </DocumentationPageShell>
    )
}
