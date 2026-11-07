import { FilePreviewLink } from "@/components/shared/file-preview-link"
import type { RfqAttachment } from "@/types"

type RfqAttachmentsSectionProps = {
  attachments: RfqAttachment[]
}

export const RfqAttachmentsSection = ({ attachments }: RfqAttachmentsSectionProps) => (
  <section className="bg-card border border-border rounded-2xl p-6">
    <h2 className="text-base font-bold text-foreground mb-4">Вложения</h2>
    {attachments.length === 0 ? (
      <p className="text-sm text-muted-foreground">Вложений нет</p>
    ) : (
      <ul className="space-y-2">
        {attachments.map((file) => (
          <li key={file.id}>
            <FilePreviewLink
              url={file.file_url}
              fileName={file.file_name}
              fileType={file.file_type}
            />
          </li>
        ))}
      </ul>
    )}
  </section>
)
