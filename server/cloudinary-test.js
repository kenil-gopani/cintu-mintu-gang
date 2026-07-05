const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'zzsbeq6l', // ← replace this (already using your credentials)
  api_key: '813444842971254', // ← replace this
  api_secret: 'WwB7QPLxDnwRfV5pCvex89xaTYI', // ← replace this
  secure: true
});

async function run() {
  try {
    console.log("Starting Cloudinary upload process...\n");
    
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg', 
      { public_id: 'onboarding_sample' }
    );
    
    console.log("Upload successful!");
    console.log("Secure URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);

    // 3. Get image details
    console.log("\n--- Image Metadata ---");
    console.log("Width:", uploadResult.width);
    console.log("Height:", uploadResult.height);
    console.log("Format:", uploadResult.format);
    console.log("Size (bytes):", uploadResult.bytes);

    // 4. Transform the image
    // f_auto: Automatically selects the most efficient image format (like WebP or AVIF) supported by the user's browser.
    // q_auto: Automatically adjusts compression to reduce file size without any visible loss of visual quality.
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("\nError during Cloudinary integration:");
    console.error(error);
  }
}

run();
