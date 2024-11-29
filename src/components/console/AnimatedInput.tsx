import React, { useState, useEffect } from "react";

export const AnimatedInput = ({ placeholder: passedPlaceholder = "", ...passedProps }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    const [placeholder, setPlaceholder] = useState(passedPlaceholder.slice(0, 0));
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        const typingInterval = setInterval(() => {
            if (isTyping) {
                setPlaceholder(passedPlaceholder.slice(0, placeholderIndex));
                if (placeholderIndex + 1 > passedPlaceholder.length) {
                    setIsTyping(false);
                    clearInterval(typingInterval);
                } else {
                    setPlaceholderIndex(placeholderIndex + 1);
                }
            }
        }, 120);

        const pauseTimeout = setTimeout(() => {
            if (!isTyping) {
                setIsTyping(true);
                setPlaceholderIndex(0);
            }
        }, isTyping ? 0 : 2000);

        return () => {
            clearInterval(typingInterval);
            clearTimeout(pauseTimeout);
        };
    }, [passedPlaceholder, placeholderIndex, isTyping]);

    return (
        <textarea
            {...passedProps}
            placeholder={placeholder}
            style={{ padding: '10px', height: 'auto', lineHeight: '1.5em', resize: 'none' }}
        />
    );
};
