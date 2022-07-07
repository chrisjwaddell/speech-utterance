// SpeechSynthesisUtterance doesn't let us change settings like rate, voice or pitch once it's started.
// To get around this limitation, we can change these settings at the end of a sentence by splitting it
// into several Utterances and use the onEnd utterance event to go to the next sentence with new settings

let SpeechSynth = {
    rate: 1,
    pitch: 1,
    voice: null,
    voices: null,
    lang: "en",
    utteranceId: 0,
    speechSynthCounter: 0,
    utterance: null,
    speakTimeout: null,

    // listener is an object that has events in that object
    init: function (listener) {
        SpeechSynth.populateVoices(listener);

        let self = this
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = function () {
                self.populateVoices(listener);
            };
        }

        this.utterance = new SpeechSynthesisUtterance()
    },

    // onVoiceList method on the listener can be used to populate the DOM
    // with the voice list
    populateVoices: function (listener) {
        const synth = window.speechSynthesis
        let voices = synth.getVoices()

        if (voices != null && voices.length > 0) {
            if (this.voices == null || this.voices.length == 0) {
                this.voices = voices;
                // default is the first English voice it can find
                this.voice = this.voices.find(cv => cv.lang.startsWith("en")) || this.voices[0]
            }

            if (listener && listener.onVoiceList) {
                listener.onVoiceList();
            }
        }
    },


    setVoice: function (voiceName) {
        return (SpeechSynth.voices.filter((voice, i) => (voice.name === voiceName)).length > 0) ? SpeechSynth.voices.filter((voice, i) => (voice.name === voiceName))[0] : this.voices[0]
    },

    setRate: function (rate) {
        if (typeof rate == 'string') {
            rate = Number(rate);
        }

        if (isNaN(rate)) {
            return;
        }

        if (rate < 0.1) {
            rate = 0.1;
        }

        if (rate > 4) {
            rate = 4;
        }

        this.rate = rate;
    },

    setPitch: function (pitch) {
        this.pitch = pitch
    },

    isInitiated: function () {
        return this.voices != null;
    },


    // Sets the current Utterance object settings - voice and text since rate and voice can
    // be changed by the user after it's started.
    // text goes into utternance.text property. Text is the current sentence, it does one sentence at a time.
    // Then run the Utterance to do the speaking - utteranceStart() does this.
    // Utterance object has events - onEnd is used to loop to the next sentence which can have different.
    // Utterance settings if the user has changed any settings eg voice, speed or pitch.
    // Utterance.rate/voice are assigned the SpeechSynth.rate/voice defaults
    utteranceSettings: function (listener) {
        if (!this.isInitiated()) {
            return false;
        }

        this.utteranceId++;

        let utterance = this.utterance;
        utterance.text = listener.text;
        utterance.rate = this.rate;
        utterance.voice = this.voice;
        utterance.lang = this.voice.lang || this.lang;
        utterance.pitch = this.pitch;
        utterance.volume = 1;

        utterance.onstart = function (ev) {
            this.speechSynthCounter++;
        }

        utterance.onend = function (ev) {
            if (this.speechSynthCounter > 0) {
                this.speechSynthCounter--;
            }

            utterance = null;

            if (listener && listener.onEnd) {
                listener.onEnd();
            }
        }

        utterance.onerror = function (ev) {
            if (this.speechSynthCounter > 0) {
                this.speechSynthCounter--;
            }

            utterance = null;
        }


        if (this.speechSynthCounter > 0) {
            this.stop();
            this.speakTimeout = window.setTimeout(function () {
                self.utteranceStart(utterance);
            }, 200);
        } else {
            // speak now
            this.utteranceStart(utterance);
        }

    },

    stop() {
        if (this.speakTimeout != null) {
            window.clearTimeout(this.speakTimeout);
            this.speakTimeout = null;
        }

        window.speechSynthesis.cancel();
    },


    utteranceStart(utterance) {
        // This starts off the speaking,
        // window.speechSynthesis.speak() is split into sentences. The "end" event
        // triggers when each sentence is spoken and starts the next sentence

        if (this.speakTimeout != null) {
            window.clearTimeout(this.speakTimeout);
            this.speakTimeout = null;
        }

        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

        this.speakTimeout = window.setTimeout(function () {
            window.speechSynthesis.speak(utterance);
        }, 200);

    }

    // SpeechSynth
}
