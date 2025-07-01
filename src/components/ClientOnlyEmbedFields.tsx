'use client';

import { useEffect, useState } from 'react';
import {
    DiscordEmbedField,
    DiscordEmbedFields,
} from "@skyra/discord-components-react";
import { parseMarkdown, type MentionContext } from "@/lib/markdown";
import type { DiscordMessage } from "@/lib/discord-api";

interface ClientOnlyEmbedFieldsProps {
    fields: NonNullable<DiscordMessage["embeds"][0]["fields"]>;
    mentionContext?: MentionContext;
}

export function ClientOnlyEmbedFields({ fields, mentionContext }: ClientOnlyEmbedFieldsProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // Return nothing during SSR
    }

    return (
        <DiscordEmbedFields slot="fields">
            {fields.map((field, fieldIndex) => {
                // Create a stable key using field name and index
                const stableKey = `${field.name}-${fieldIndex}`;

                return (
                    <DiscordEmbedField
                        key={stableKey}
                        fieldTitle={field.name}
                        inline={field.inline ? true : undefined}
                    >
                        <div
                            dangerouslySetInnerHTML={{
                                __html: parseMarkdown(field.value, mentionContext, false),
                            }}
                        />
                    </DiscordEmbedField>
                );
            })}
        </DiscordEmbedFields>
    );
}
