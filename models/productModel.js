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

productSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    return next();
  }

  let baseSlug = this.name;
  let slug = baseSlug;
  let count = 1;

  while (await this.constructor.findOne({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
  next();
});

productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update.name) {
    let baseSlug = update.name;
    let slug = baseSlug;
    let count = 1;

    const Model = this.model;
    while (await Model.findOne({ slug, _id: { $ne: this.getQuery()._id } })) { // $ne excludes this.
      slug = `${baseSlug}-${count++}`;
    }

    update.slug = slug;
    this.setUpdate(update);
  }

  next();
});


export default mongoose.model("Products", productSchema);
