import "./LoadingOverlay.css"; // Include the CSS manually

export default function LoadingExample({active}) {
  if (active == true) {
    return (
          <div className="overlay">
            <div className="spinner"></div>
          </div>
    );
  } else {
    return null;
  }
}
