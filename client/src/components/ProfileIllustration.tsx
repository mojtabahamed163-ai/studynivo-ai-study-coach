const studyIllustrationUrl = "/manus-storage/async-images/knBZ9ZXfSCmqbWxbhGMZFq/image-1.webp";

export function ProfileIllustration() {
  return (
    <div className="profile-illustration" aria-hidden="true">
      <img
        src={studyIllustrationUrl}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
