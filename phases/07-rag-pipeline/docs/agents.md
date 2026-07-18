# Agent notes

An agent is a loop around a model with tools. The model receives tool
definitions, and when it wants to call a tool it stops with a tool_use
request. The loop validates the tool input, runs the real function, and
feeds the result back so the model can continue. Always cap the number of
iterations so a confused agent cannot loop forever and burn budget.
