/**
 * A plugin to check for valid alternative representations for images
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("alt-text");
let audit = require("../shared/audit");

require("./style.less");

class AltTextPlugin extends Plugin {
    getName() {
        return "alt-text";
    }

    getTitle() {
        return "Alternative text";
    }

    getDescription() {
        return "Annotates elements without text alternatives";
    }

    reportImageError(el) {
        let $el = $(el);
        let src = $el.attr("src") || "..";
        let title = "Image is missing alt text";
        let $error = (
            <div>
                <p>
                    This image does not have an associated "alt" attribute.
                    Please specify a short alt text for this image like so
                    to convey the same information textually:
                </p>

                <pre><code>
                    {`&lt;img src="${src}" alt="Image description"&gt`}
                </code></pre>

                <p>
                    If the image is decorative and does not convey any
                    information to the surrounding content then you should
                    leave this "alt" attribute empty, or specify a "role"
                    attribute with a value of "presentation" so assistive
                    technologies can ignore the image.
                </p>

                <pre><code>
                    {`&lt;img src="${src}" alt=""&gt;`}
                    <br />
                    {`&lt;img src="${src}" role="presentation"&gt;`}
                </code></pre>

                <p>
                    Extended text descriptions can be provided using <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-describedby_attribute" target="_blank">
                        <code>aria-describedby</code>
                    </a>
                </p>
            </div>
        );

        // Place an error label on the element and register it as an
        // error in the info panel
        let entry = this.error(title, $error, $el);
        annotate.errorLabel($el, "", title, entry);
    }

    reportAudiovisualError(el, elementName) {
        let $el = $(el);
        let elementCapitalised = elementName.charAt(0).toUpperCase() +
            elementName.slice(1);
        let title = `${elementCapitalised} is missing text alternatives`;
        let $error = (
            <div>
                <p>
                    This <code>{elementName}</code> element does not have any
                    text alternatives. Please provide some text
                    alternatives to convey as much of the same information
                    textually as possible.
                </p>

                <p>
                    Breif fallback text may be given with the enclosed text
                    like so, which will be displayed if the browser cannot
                    play the file types:
                </p>

                <pre><code>
                    {`&lt;${elementName}&gt;Description&lt;/${elementName}&gt;`}
                </code></pre>

                <p>
                    Further text alternatives can be given
                    with ARIA and the <code>track</code> element.
                    For instance if your webpage contains the transcript of
                    the {elementName} then you could use ARIA like so:
                </p>

                <pre><code>
                    {`&lt;${elementName} aria-describedby="transcriptId"&gt;`}
                </code></pre>

                <p>
                    If you can provide a <code>track</code> element users will
                    be able to access timed text data such as captions.
                </p>

                <p>
                    If this element is purely decorative such as a background
                    video then you should specify a "role"
                    attribute with a value of "presentation" so assistive
                    technologies can ignore the element.
                </p>

                <pre><code>
                    {`&lt;${elementName} role="presentation"&gt;`}
                </code></pre>

                <div class="tota11y-info-resources">
                    <p>
                        Resources
                    </p>
                    <ul>
                        <li>
                            <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track" target="_blank">
                                The track element
                            </a>
                        </li>
                        <li>
                            <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA" target="_blank">
                                ARIA
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );

        // Place an error label on the element and register it as an
        // error in the info panel
        let entry = this.error(title, $error, $el);
        annotate.errorLabel($el, "", title, entry);
    }

    run() {
        // Generate errors for any images that fail the Accessibility
        // Developer Tools audit
        let {result, elements} = audit("imagesWithoutAltText");

        if (result === "FAIL") {
            elements.forEach(this.reportImageError.bind(this));
        }

        // Additionally, label presentational images
        $(`img[role="presentation"], img[alt=""]`).each((i, el) => {
            // "Error" labels have a warning icon and expanded text on hover,
            // but we add a special `warning` class to color it differently.
            annotate
                .errorLabel($(el), "", "This image is decorative")
                .addClass("tota11y-label-warning");
        });

        // Also check audio and video elements for captions and text
        // alternatives of any kind
        $(`audio, video`).each((i, el) => {
            if (axs.utils.isElementOrAncestorHidden(el)) {
                // skip hidden elements
                return;
            }

            let $el = $(el);

            let textAlternatives = {};
            axs.properties.findTextAlternatives(el, textAlternatives);
            let noTextAlternatives = Object.keys(textAlternatives).length === 0;

            let hasCaptions = $el.find("track[kind=captions]").length > 0;

            if (noTextAlternatives && !hasCaptions) {
                this.reportAudiovisualError(
                    el, $el.prop("tagName").toLowerCase()
                );
            }
        });
    }

    cleanup() {
        annotate.removeAll();
    }
}

module.exports = AltTextPlugin;
