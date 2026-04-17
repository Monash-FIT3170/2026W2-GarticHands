import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

const Submission = mongoose.model('Submission', submissionSchema)

export default Submission

