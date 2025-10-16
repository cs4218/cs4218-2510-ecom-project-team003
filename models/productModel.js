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
      min: [0.01, "Price must be positive"],
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity must be non-negative"],
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

productSchema.statics.generateUniqueSlug = async function (slug, excludeId) {
  const query = { slug, _id: { $ne: excludeId } };
  let count = 1;

  while (await this.findOne(query)) {
    query.slug = `${slug}-${count++}`;
  }
  return query.slug;
}

productSchema.pre("save", async function (next) {
  this.slug = await this.constructor.generateUniqueSlug(this.slug, this._id);
  next();
});

productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const slug = update.slug;
  if (!slug) return next();

  update.slug = await this.model.generateUniqueSlug(slug, this.getQuery()._id);
  this.setUpdate(update);
  next();
});

export default mongoose.model("Products", productSchema);
