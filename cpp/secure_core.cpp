#include <cstddef>
#include <cstdint>
#include <string>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define COVIAN_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define COVIAN_EXPORT
#endif

namespace covian {

constexpr const char* kBlockedUrl = "about:invalid#covian-blocked-url";

bool is_ascii_whitespace(unsigned char c) {
  return c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f';
}

bool validate_utf8_bytes(const std::string& input) {
  std::size_t i = 0;
  const std::size_t n = input.size();

  while (i < n) {
    const unsigned char c = static_cast<unsigned char>(input[i]);

    if (c <= 0x7F) {
      i += 1;
      continue;
    }

    if ((c >> 5) == 0x6) {
      if (i + 1 >= n) return false;
      const unsigned char c1 = static_cast<unsigned char>(input[i + 1]);
      if ((c1 & 0xC0) != 0x80) return false;
      const uint32_t cp = ((c & 0x1F) << 6) | (c1 & 0x3F);
      if (cp < 0x80) return false;
      i += 2;
      continue;
    }

    if ((c >> 4) == 0xE) {
      if (i + 2 >= n) return false;
      const unsigned char c1 = static_cast<unsigned char>(input[i + 1]);
      const unsigned char c2 = static_cast<unsigned char>(input[i + 2]);
      if ((c1 & 0xC0) != 0x80 || (c2 & 0xC0) != 0x80) return false;
      const uint32_t cp = ((c & 0x0F) << 12) | ((c1 & 0x3F) << 6) | (c2 & 0x3F);
      if (cp < 0x800 || (cp >= 0xD800 && cp <= 0xDFFF)) return false;
      i += 3;
      continue;
    }

    if ((c >> 3) == 0x1E) {
      if (i + 3 >= n) return false;
      const unsigned char c1 = static_cast<unsigned char>(input[i + 1]);
      const unsigned char c2 = static_cast<unsigned char>(input[i + 2]);
      const unsigned char c3 = static_cast<unsigned char>(input[i + 3]);
      if ((c1 & 0xC0) != 0x80 || (c2 & 0xC0) != 0x80 || (c3 & 0xC0) != 0x80) return false;
      const uint32_t cp = ((c & 0x07) << 18) | ((c1 & 0x3F) << 12) | ((c2 & 0x3F) << 6) | (c3 & 0x3F);
      if (cp < 0x10000 || cp > 0x10FFFF) return false;
      i += 4;
      continue;
    }

    return false;
  }

  return true;
}

std::string normalize(const std::string& input) {
  std::string out;
  out.reserve(input.size());

  for (std::size_t i = 0; i < input.size(); i += 1) {
    const char ch = input[i];
    if (ch == '\r') {
      if ((i + 1) < input.size() && input[i + 1] == '\n') {
        i += 1;
      }
      out.push_back('\n');
      continue;
    }

    const unsigned char uch = static_cast<unsigned char>(ch);
    if (uch == 0x00) {
      continue;
    }

    out.push_back(ch);
  }

  return out;
}

bool has_disallowed_control_chars(const std::string& input) {
  for (unsigned char c : input) {
    if (c <= 0x1F && c != '\n' && c != '\r' && c != '\t') {
      return true;
    }
    if (c == 0x7F) {
      return true;
    }
  }
  return false;
}

void append_hex_entity(std::string& out, unsigned char c) {
  static constexpr char kHex[] = "0123456789ABCDEF";
  out.append("&#x");
  out.push_back(kHex[(c >> 4) & 0x0F]);
  out.push_back(kHex[c & 0x0F]);
  out.push_back(';');
}

std::string encode_html_text(const std::string& input) {
  std::string out;
  out.reserve(input.size() * 2);

  for (unsigned char c : input) {
    switch (c) {
      case '&': out.append("&amp;"); break;
      case '<': out.append("&lt;"); break;
      case '>': out.append("&gt;"); break;
      default:
        if ((c <= 0x1F && c != '\n' && c != '\t') || c == 0x7F) {
          append_hex_entity(out, c);
        } else {
          out.push_back(static_cast<char>(c));
        }
    }
  }

  return out;
}

std::string encode_html_attr(const std::string& input) {
  std::string out;
  out.reserve(input.size() * 2);

  for (unsigned char c : input) {
    switch (c) {
      case '&': out.append("&amp;"); break;
      case '<': out.append("&lt;"); break;
      case '>': out.append("&gt;"); break;
      case '"': out.append("&quot;"); break;
      case '\'': out.append("&#x27;"); break;
      case '`': out.append("&#x60;"); break;
      case '=': out.append("&#x3D;"); break;
      default:
        if ((c <= 0x1F && c != '\n' && c != '\t') || c == 0x7F) {
          append_hex_entity(out, c);
        } else {
          out.push_back(static_cast<char>(c));
        }
    }
  }

  return out;
}

char to_lower_ascii(char c) {
  if (c >= 'A' && c <= 'Z') {
    return static_cast<char>(c - 'A' + 'a');
  }
  return c;
}

bool starts_with_forbidden_scheme(const std::string& url) {
  std::string lowered;
  lowered.reserve(url.size());

  for (char c : url) {
    lowered.push_back(to_lower_ascii(c));
  }

  auto starts_with = [&](const char* prefix) {
    std::size_t idx = 0;
    while (prefix[idx] != '\0') {
      if (idx >= lowered.size() || lowered[idx] != prefix[idx]) return false;
      idx += 1;
    }
    return true;
  };

  return starts_with("javascript:") || starts_with("data:") || starts_with("vbscript:");
}

bool has_allowed_scheme_or_relative(const std::string& url) {
  const auto colon_pos = url.find(':');
  const auto slash_pos = url.find('/');
  const auto q_pos = url.find('?');
  const auto hash_pos = url.find('#');

  if (colon_pos == std::string::npos ||
      (slash_pos != std::string::npos && colon_pos > slash_pos) ||
      (q_pos != std::string::npos && colon_pos > q_pos) ||
      (hash_pos != std::string::npos && colon_pos > hash_pos)) {
    return true;
  }

  std::string scheme = url.substr(0, colon_pos);
  for (char& c : scheme) {
    c = to_lower_ascii(c);
  }

  return scheme == "http" || scheme == "https";
}

std::string percent_encode_url(const std::string& input) {
  static constexpr char kHex[] = "0123456789ABCDEF";
  std::string out;
  out.reserve(input.size() * 3);

  for (unsigned char c : input) {
    const bool unreserved =
      (c >= 'A' && c <= 'Z') ||
      (c >= 'a' && c <= 'z') ||
      (c >= '0' && c <= '9') ||
      c == '-' || c == '_' || c == '.' || c == '~' ||
      c == '/' || c == '?' || c == '#' || c == '[' || c == ']' ||
      c == '@' || c == '!' || c == '$' || c == '&' || c == '\'' ||
      c == '(' || c == ')' || c == '*' || c == '+' || c == ',' ||
      c == ';' || c == '=' || c == ':';

    if (unreserved) {
      out.push_back(static_cast<char>(c));
    } else {
      out.push_back('%');
      out.push_back(kHex[(c >> 4) & 0x0F]);
      out.push_back(kHex[c & 0x0F]);
    }
  }

  return out;
}

std::string safe_or_blocked_url(const std::string& raw) {
  std::string norm = normalize(raw);
  std::size_t start = 0;
  while (start < norm.size() && is_ascii_whitespace(static_cast<unsigned char>(norm[start]))) {
    start += 1;
  }

  std::size_t end = norm.size();
  while (end > start && is_ascii_whitespace(static_cast<unsigned char>(norm[end - 1]))) {
    end -= 1;
  }

  const std::string trimmed = norm.substr(start, end - start);
  if (trimmed.empty()) {
    return std::string(kBlockedUrl);
  }

  if (!validate_utf8_bytes(trimmed) || has_disallowed_control_chars(trimmed)) {
    return std::string(kBlockedUrl);
  }

  if (starts_with_forbidden_scheme(trimmed)) {
    return std::string(kBlockedUrl);
  }

  if (!has_allowed_scheme_or_relative(trimmed)) {
    return std::string(kBlockedUrl);
  }

  return percent_encode_url(trimmed);
}

const char* return_buffer(const std::string& value) {
  static thread_local std::string buffer;
  buffer = value;
  return buffer.c_str();
}

}  // namespace covian

extern "C" {

COVIAN_EXPORT const char* encode_text(const char* input) {
  const std::string normalized = covian::normalize(input == nullptr ? "" : std::string(input));
  return covian::return_buffer(covian::encode_html_text(normalized));
}

COVIAN_EXPORT const char* encode_attr(const char* input) {
  const std::string normalized = covian::normalize(input == nullptr ? "" : std::string(input));
  return covian::return_buffer(covian::encode_html_attr(normalized));
}

COVIAN_EXPORT const char* encode_url(const char* input) {
  return covian::return_buffer(covian::safe_or_blocked_url(input == nullptr ? "" : std::string(input)));
}

COVIAN_EXPORT const char* normalize_input(const char* input) {
  return covian::return_buffer(covian::normalize(input == nullptr ? "" : std::string(input)));
}

COVIAN_EXPORT int validate_utf8(const char* input) {
  return covian::validate_utf8_bytes(input == nullptr ? std::string() : std::string(input)) ? 1 : 0;
}

COVIAN_EXPORT int detect_control_chars(const char* input) {
  return covian::has_disallowed_control_chars(input == nullptr ? std::string() : std::string(input)) ? 1 : 0;
}

// Wasm ABI exports requested by JS layer.
COVIAN_EXPORT const char* encodeText(const char* input) { return encode_text(input); }
COVIAN_EXPORT const char* encodeAttr(const char* input) { return encode_attr(input); }
COVIAN_EXPORT const char* encodeURL(const char* input) { return encode_url(input); }
COVIAN_EXPORT int validateUTF8(const char* input) { return validate_utf8(input); }

}
