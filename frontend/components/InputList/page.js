import "./inputlist.css";

export default function LoadingExample({
  active,
  options,
  onSubmit,
  type,
  value,
}) {
  if (active == true) {
    let filteredOptions = options;
    if (value != "") {
      filteredOptions = options.filter((option) =>
        type == "course"
          ? option.course_name.toLowerCase().includes(value.toLowerCase())
          : type == "subject"
          ? option.subject_name.toLowerCase().includes(value.toLowerCase())
          : type == "competency"
          ? option.competency_name.toLowerCase().includes(value.toLowerCase())
          : type == "skill"
          ? option.skill_name.toLowerCase().includes(value.toLowerCase())
          : type == "student"
          ? option.name.toLowerCase().includes(value.toLowerCase())
          : option.title.toLowerCase().includes(value.toLowerCase())
      );
    }
    return (
      <ul>
        {filteredOptions.map((option, index) => (
          <li key={index} onMouseDown={() => onSubmit(option)}>
            {type == "course"
              ? option.course_name
              : type == "subject"
              ? option.subject_name
              : type == "competency"
              ? option.competency_name
              : type == "skill"
              ? option.skill_name
              : type == "student"
              ? option.name
              : option.title}
          </li>
        ))}
        {filteredOptions.length == 0 && <li>No Option</li>}
      </ul>
    );
  } else {
    return null;
  }
}
