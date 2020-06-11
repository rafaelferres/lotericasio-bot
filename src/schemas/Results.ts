import { Schema, model, Document } from 'mongoose';

const ResultsSchema = new Schema({
    concurso: Schema.Types.Mixed,
}, {
    timestamps: true,
    strict: false
});

export default model('Results', ResultsSchema);