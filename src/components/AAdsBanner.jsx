import { useEffect } from "react";

export default function AAdsBanner() {
  useEffect(() => {
    const frame = document.getElementById("aads-container");

    if (!frame || frame.innerHTML) return;

    frame.innerHTML = `
      <div id="frame" style="width:100%;margin:auto;position:relative;z-index:99998;">
        <iframe
          data-aa="2438193"
          src="//acceptable.a-ads.com/2438193/?size=Adaptive&background_color=1710c9&title_color=f8f8f8&title_hover_color=000000&text_color=000000&link_color=e7e8e8&link_hover_color=ababab"
          style="border:0;padding:0;width:100%;height:250px;overflow:hidden;display:block;margin:auto;"
        ></iframe>
      </div>
    `;
  }, []);

  return (
    <div
      id="aads-container"
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-full"
    />
  );
}