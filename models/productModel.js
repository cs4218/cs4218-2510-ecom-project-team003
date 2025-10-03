import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    shipping: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", async function(next) {
  if (!this.isModified("name")) {
    return next();
  }

  let baseSlug = this.name;
  let slug = baseSlug;
  let count = 1;

  while (await this.constructor.findOne({slug})) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
  next();
});

export default mongoose.model("Products", productSchema);
