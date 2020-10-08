from dataclasses import dataclass


@dataclass
class Config:
    model_dir: str = "./deepspeech-0.8.2-models"
    beam_width: int = 780
    default_sample_rate: int = 16000
    scorer_alpha: float = 0.75
    scorer_beta: float = 1.85
    vad_aggressiveness: int = 1
    trie: str = f"./{model_dir}/trie"
    model_path: str = f"./{model_dir}/{model_dir}.pbmm"
    scorer: str = f"./{model_dir}/{model_dir}.scorer"
