exports.uploadRoomImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image file uploaded",
    });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const imagePath = `/uploads/rooms/${req.file.filename}`;

  res.status(201).json({
    message: "Room image uploaded successfully",
    image: `${baseUrl}${imagePath}`,
  });
};
