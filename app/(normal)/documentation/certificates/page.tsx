import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { Prose } from '@/components/documentation/Prose'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import Link from 'next/link'

export default function DocumentationCertificatesPage() {
    return (
        <DocumentationPageShell
            activeTab="certificates"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'Certificates', url: '/documentation/certificates' },
            ]}
        >
            <Prose>
                <p>
                    Certificates for corrected submissions are available for download (for example, in the submission
                    correction page, or in Profile/Programs). These certificates are signed tgz files containing the
                    corrected submissions and information about the user who made them.
                </p>
                <p>
                    In order to check the certificate signature, the Jutge public key has to be downloaded and
                    installed:
                </p>
                <p>
                    <Link href="https://jutge.org/documentation/certificates/publickey">
                        <Button>
                            <Download aria-hidden />
                            Download public key
                        </Button>
                    </Link>
                </p>
                <p>To install the public key, run the following command:</p>
                <pre>
                    <code>gpg --import --armor &lt; jutge_publickey.asc</code>
                </pre>
                <p>Then, to check the certificate signature, run the following command:</p>
                <pre>
                    <code>gpg certificate.tgz.gpg</code>
                </pre>
                <p>The signature will be verified, and a certificate.tgz file will be created.</p>
            </Prose>
        </DocumentationPageShell>
    )
}
