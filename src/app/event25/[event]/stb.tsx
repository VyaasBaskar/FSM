"use client";

export default function SaveTextButton({
  text,
  filename,
}: {
  text: string;
  filename: string;
}) {
  const handleClick = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  return <button onClick={handleClick}>Save File</button>;
}
