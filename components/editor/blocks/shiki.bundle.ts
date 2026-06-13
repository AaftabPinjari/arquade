import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import { createHighlighterCore } from "@shikijs/core";
import type { HighlighterGeneric } from "@shikijs/types";

// Languages we support (lazy-loaded from @shikijs/langs)
import langTypeScript from "@shikijs/langs/typescript";
import langJavaScript from "@shikijs/langs/javascript";
import langTSX from "@shikijs/langs/tsx";
import langJSX from "@shikijs/langs/jsx";
import langPython from "@shikijs/langs/python";
import langHTML from "@shikijs/langs/html";
import langCSS from "@shikijs/langs/css";
import langJSON from "@shikijs/langs/json";
import langBash from "@shikijs/langs/shellscript";
import langRust from "@shikijs/langs/rust";
import langGo from "@shikijs/langs/go";
import langSQL from "@shikijs/langs/sql";
import langYAML from "@shikijs/langs/yaml";
import langMarkdown from "@shikijs/langs/markdown";
import langCpp from "@shikijs/langs/cpp";
import langCSharp from "@shikijs/langs/csharp";
import langJava from "@shikijs/langs/java";
import langRuby from "@shikijs/langs/ruby";
import langKotlin from "@shikijs/langs/kotlin";
import langSwift from "@shikijs/langs/swift";
import langScala from "@shikijs/langs/scala";
import langPhp from "@shikijs/langs/php";
import langGraphQL from "@shikijs/langs/graphql";
import langXML from "@shikijs/langs/xml";

// Themes
import themeGithubDark from "@shikijs/themes/github-dark";
import themeGithubLight from "@shikijs/themes/github-light";

export function createHighlighter(): Promise<HighlighterGeneric<any, any>> {
  return createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [
      langTypeScript,
      langJavaScript,
      langTSX,
      langJSX,
      langPython,
      langHTML,
      langCSS,
      langJSON,
      langBash,
      langRust,
      langGo,
      langSQL,
      langYAML,
      langMarkdown,
      langCpp,
      langCSharp,
      langJava,
      langRuby,
      langKotlin,
      langSwift,
      langScala,
      langPhp,
      langGraphQL,
      langXML,
    ],
    themes: [themeGithubDark, themeGithubLight],
  }) as Promise<HighlighterGeneric<any, any>>;
}
