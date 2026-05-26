import Image from "next/image";

export function FloatChatButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="float-chat-wrap">
      <button type="button" className="float-chat-btn" onClick={onClick} aria-label="Ask Shankara">
        <Image
          src="/chat-logo.png"
          alt=""
          aria-hidden="true"
          width={64}
          height={64}
          className="float-chat-logo"
        />
      </button>
    </div>
  );
}
