import { Schema, model, Document } from 'mongoose';

const ResultsSchema = new Schema({
    concurso: String
}, {
    timestamps: true,
    strict: true
});

export default model('Results', ResultsSchema);