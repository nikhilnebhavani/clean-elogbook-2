import "./popup.css";
import Image from "next/image";

export default function Popup({active, type, message, onClose}) {
  if (active == true) {
    let image_url = "";
    if (type == "no-found") {
      image_url = "/gifs/no-found.gif";
    }
    else if (type == "wrong") {
      image_url = "/gifs/wrong.gif";
    }
    else if (type == "success") {
      image_url = "/gifs/success.gif";
    }
    else{
      image_url = "/gifs/error.gif";
    }

    return (
      <div className="overlay">
        <div className="box">
          <button
            onClick={() => {
              onClose();
            }}
          >
            X
          </button>
          <Image src={image_url} width={100} height={100} alt="" />
          <p>{message}</p>
        </div>
      </div>
    );
  } else {
    return null;
  }
}
