interface MessageBannerProps {
    message: string;
    isOpen: boolean;
    style?: Record<string, string | number>;
}
declare const MessageBanner: ({ isOpen, message, style }: MessageBannerProps) => import("react/jsx-runtime").JSX.Element | null;
export default MessageBanner;
