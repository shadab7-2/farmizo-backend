const cloudinary = require("../config/cloudinary");

const uploadBufferToCloudinary = (buffer, folder = "farmizo/products") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

const extractPublicIdFromUrl = (url = "") => {
  const marker = "/upload/";
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) return null;

  let rest = url.slice(markerIndex + marker.length);
  rest = rest.replace(/^v\d+\//, "");

  const dotIndex = rest.lastIndexOf(".");
  if (dotIndex === -1) return rest;

  return rest.slice(0, dotIndex);
};

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
};
