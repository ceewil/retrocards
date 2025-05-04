document.getElementById("imageUpload").addEventListener("change", function () {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  const file = this.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

document.querySelectorAll(".template").forEach((template) => {
  template.addEventListener("click", function () {
    document
      .querySelectorAll(".template")
      .forEach((el) => el.classList.remove("selected"));
    this.classList.add("selected");
  });
});

document
  .getElementById("customizer-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const selected = document.querySelector(".template.selected");
    const uploaded = document.getElementById("imageUpload").files[0];

    if (!selected || !uploaded) {
      alert("Please upload a photo and select a character template.");
      return;
    }

    alert(`Photo + "${selected.dataset.character}" template selected.`);
    // This is where you'd integrate API logic or forward to next step
  });
