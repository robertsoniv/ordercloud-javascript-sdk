/**
 * Parsed error response structure
 */
export interface ParsedErrorResponse {
  response: Response
  data?: any
  text?: string
}

/**
 * Parses error Response objects to extract error data for OrderCloudError
 * Handles JSON responses, text/HTML responses, and BOM characters
 *
 * @param response - The Response object from a failed request
 * @returns Object containing response, parsed data (if JSON), and text (if non-JSON)
 */
export async function parseErrorResponse(
  response: Response
): Promise<ParsedErrorResponse> {
  let data: any
  let text: string | undefined

  try {
    const contentType = response.headers.get('content-type')
    const responseText = await response.text()

    if (responseText) {
      // Handle BOM character if present
      const cleanText =
        responseText.charCodeAt(0) === 65279
          ? responseText.substring(1)
          : responseText

      if (contentType && contentType.includes('application/json')) {
        // Try to parse as JSON
        try {
          data = JSON.parse(cleanText)
        } catch (parseError) {
          // If JSON parsing fails, store as text
          text = cleanText
        }
      } else {
        // Non-JSON response (HTML, plain text, etc.)
        text = cleanText
      }
    }
  } catch (e) {
    // If reading response fails, leave data and text undefined
  }

  return {
    response,
    data,
    text,
  }
}
