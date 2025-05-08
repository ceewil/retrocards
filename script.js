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
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const selected = document.querySelector(".template.selected");
    const uploadedFile = document.getElementById("imageUpload").files[0];
    const spinner = document.getElementById("spinner");
    const preview = document.getElementById("preview");

    if (!selected || !uploadedFile) {
      alert("Please upload a photo and select a character template.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", uploadedFile);
    formData.append("character", selected.dataset.character);

    spinner.style.display = "block";
    preview.innerHTML = "";

    try {
    const response = await fetch("https://retrocardtest.onrender.com/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      spinner.style.display = "none";

      if (data.imageUrl) {
        preview.innerHTML = `<img src="${data.imageUrl}" alt="Generated Image" />`;
      } else {
        alert("Image generation failed. Please try again.");
      }
    } catch (err) {
      spinner.style.display = "none";
      console.error("Error:", err);
      alert("An error occurred while generating the image.");
    }
  });
