import mongoose from "mongoose";

const wasteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
       type: String,
       enum: ["Plastic", "Metal", "Paper", "Electronic", "Other", ""],
       default: "",
    },
    grade: {
       type: String,
       enum: ["Sorted/Clean", "Unsorted/Mixed", "Industrial Grade", ""],
       default: "",
    },
    description: {
      type: String,
      default: "",
    },
    listingType: {
      type: String,
      enum: ["fixed", "bidding"],
      default: "fixed",
    },
    price: {
      type: Number,
    },
    unit: {
      type: String,
    },
    quantity: {
      type: Number,
    },
    location: {
      type: {
        type: String, 
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
      address: {
        type: String
      }
    },
    images: {
      type: [String], // Array of file paths
      default: [],
    },
    sellerId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "userData",
       // required: true, // Commented out for now if frontend doesn't pass authorization token yet
    }
  },
  { timestamps: true }
);

// Ensure geospatial indexing if needed later
// wasteSchema.index({ location: "2dsphere" });

export default mongoose.model("Waste", wasteSchema);
